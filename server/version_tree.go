package main

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"strings"
)

type Node interface {
	AddRune(r rune, position int)
	SetParent(Node)
	WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error
	Print(indentation int)
	GetLength() int
	Persist(addresses AddressTable, slices *mgo.Collection) (AddressTable, error)
}

func Indent(indentation int) {
	fmt.Print(strings.Repeat("  ", indentation))
}

type Root struct {
	Down Node
}

func (root *Root) AddRune(r rune, position int) {
	root.Down.AddRune(r, position)
}

func (r *Root) SetParent(Node) {}

func (r *Root) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	return r.Down.WriteToBuffer(buffer, slices)
}

func (r *Root) Print(indentation int) {
	Indent(indentation)
	fmt.Println("ROOT")
	r.Down.Print(indentation + 1)
}

func (r *Root) GetLength() int {
	return r.Down.GetLength()
}

func (r *Root) Persist(addresses AddressTable, slices *mgo.Collection) (AddressTable, error) {
	return r.Down.Persist(addresses, slices)
}

type Branch struct {
	Parent             Node
	LengthLeft, Length int
	Left, Right        Node
}

func (b *Branch) IsLeftmostTNode() bool {
	switch left := b.Left.(type) {
	case *Branch:
		return left.IsRightmostTNode()
	case *TNode:
		return true
	default:
		return false
	}
}

func (b *Branch) IsRightmostTNode() bool {
	switch right := b.Right.(type) {
	case *Branch:
		return right.IsRightmostTNode()
	case *TNode:
		return true
	default:
		return false
	}
}

func (b *Branch) AddRune(r rune, position int) {
	var child Node
	if position < b.LengthLeft {
		child = b.Left
		b.LengthLeft++
	} else if position == b.LengthLeft {
		if b.IsLeftmostTNode() {
			child = b.Left
			b.LengthLeft++
		} else {
			child = b.Right
			position = position - b.LengthLeft
		}
	} else {
		child = b.Right
		position = position - b.LengthLeft
	}
	b.Length++
	child.AddRune(r, position)
}

func (b *Branch) SetParent(parent Node) {
	b.Parent = parent
}

func (b *Branch) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going deeper")
	err := b.Left.WriteToBuffer(buffer, slices)
	if err != nil {
		fmt.Println("left child writing error")
		return err
	}
	err = b.Right.WriteToBuffer(buffer, slices)
	if err != nil {
		fmt.Println("right child writing error")
	}
	return err
}

func (b *Branch) Print(indentation int) {
	Indent(indentation)
	fmt.Println("BRANCH:", b.LengthLeft, b.Length-b.LengthLeft, b.Length)
	Indent(indentation)
	fmt.Println("left :")
	b.Left.Print(indentation + 1)
	Indent(indentation)
	fmt.Println("right :")
	b.Right.Print(indentation + 1)
}

func (b *Branch) GetLength() int {
	return b.Length
}

func (b *Branch) Persist(addresses AddressTable, slices *mgo.Collection) (AddressTable, error) {
	addresses, err := b.Left.Persist(addresses, slices)
	if err != nil {
		fmt.Println("left child persistence error")
		return addresses, err
	}
	addresses, err = b.Right.Persist(addresses, slices)
	if err != nil {
		fmt.Println("right child persistence error")
	}
	return addresses, err
}

type PNode struct {
	Parent  Node
	Length  int
	Address int
}

func (p *PNode) AddRune(r rune, position int) {
	up := &Branch{Parent: p.Parent, Length: p.Length + 1}
	if position > p.Length/2 {
		up.Left = &PNode{up, position, p.Address}
		up.LengthLeft = position
		if position < p.Length {
			down := &Branch{Parent: up, Length: p.Length + 1 - position, LengthLeft: 1}
			up.Right = down
			down.Left = &TNode{down, 1, []rune{r}}
			down.Right = &PNode{down, p.Length - position, p.Address + position}
		} else {
			up.Right = &TNode{up, 1, []rune{r}}
		}
	} else {
		up.Right = &PNode{up, p.Length - position, p.Address + position}
		up.LengthLeft = position + 1
		if position > 0 {
			down := &Branch{Parent: up, Length: position + 1, LengthLeft: position}
			up.Left = down
			down.Right = &TNode{down, 1, []rune{r}}
			down.Left = &PNode{down, position, p.Address}
		} else {
			up.Left = &TNode{up, 1, []rune{r}}
		}
	}
	switch parent := p.Parent.(type) {
	case *Branch:
		fmt.Println("branch parent")
		if parent.Left == p {
			parent.Left = up
		} else {
			parent.Right = up
		}
	case *Root:
		fmt.Println("root parent")
		parent.Down = up
	}
}

func (p *PNode) SetParent(parent Node) {
	p.Parent = parent
}

func (p *PNode) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going to PNode")
	return read_block_from_permascroll_to_buffer(p.Length, p.Address, buffer, slices)
}
func (p *PNode) Print(indentation int) {
	Indent(indentation)
	fmt.Println("PNode:", p.Length, "at address", p.Address)
}

func (p *PNode) GetLength() int {
	return p.Length
}

func (p *PNode) Persist(addresses AddressTable, slices *mgo.Collection) (AddressTable, error) {
	last := addresses[len(addresses)-1]
	addresses[len(addresses)-1] = [2]int{last[0], p.Address}
	addresses = append(addresses, [2]int{last[0] + p.Length, 0})
	return addresses, nil
}

type TNode struct {
	Parent Node
	Length int
	Text   []rune
}

func (t *TNode) AddRune(r rune, position int) {
	t.Text = append(t.Text, '界')
	copy(t.Text[position+1:], t.Text[position:])
	t.Text[position] = r
	t.Length++
}

func (t *TNode) SetParent(parent Node) {
	t.Parent = parent
}

func (t *TNode) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going to TNode")
	_, err := buffer.WriteString(string(t.Text))
	return err
}

func (t *TNode) Print(indentation int) {
	Indent(indentation)
	fmt.Println("TNode:", t.Length, "of text", string(t.Text))
}

func (t *TNode) GetLength() int {
	return t.Length
}

func (t *TNode) Persist(addresses AddressTable, slices *mgo.Collection) (AddressTable, error) {
	last := addresses[len(addresses)-1]
	addresses[len(addresses)-1] = [2]int{last[0], p.Address}
	addresses = append(addresses, [2]int{last[0] + p.Length, 0})
	return addresses, nil
}

func construct_tree_from_address_table(addresses AddressTable, total_length int) Node {
	if len(addresses) == 0 {
		return nil
	}
	if len(addresses) == 1 {
		return &PNode{Length: total_length, Address: addresses[0][1]}
	}

	var i, length_left int
	for ; i < len(addresses); i++ {
		if addresses[i][0] > total_length/2 {
			length_left = addresses[i][0]
			break
		}
	}

	if i == len(addresses) {
		i = len(addresses) - 1
		length_left = addresses[i][0]
	}

	left := construct_tree_from_address_table(addresses[:i], length_left)
	right := construct_tree_from_address_table(addresses[i:], total_length-length_left)
	root := &Branch{Length: total_length, LengthLeft: length_left, Left: left, Right: right}
	left.SetParent(root)
	right.SetParent(root)
	return root
}

func construct_version_tree(document_id string, version_no int) (root *Root) {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return nil
	}
	defer db_session.Close()

	database := db_session.DB("default")
	versions := database.C("versions")

	var version Version
	err = versions.Find(bson.M{"DocumentId": bson.ObjectIdHex(document_id),
		"No": version_no}).One(&version)
	if err != nil {
		fmt.Println("retrieving version error: " + err.Error())
		return nil
	}

	root = &Root{construct_tree_from_address_table(version.Addresses, version.Size)}
	root.Down.SetParent(root)
	return root
}

func get_tree_dump(root *Root) (string, error) {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return "", err
	}
	defer db_session.Close()

	database := db_session.DB("default")
	slices := database.C("permascroll")

	var buffer bytes.Buffer
	err = root.WriteToBuffer(&buffer, slices)
	if err != nil {
		fmt.Println("Tree dump error: " + err.Error())
		return "", err
	}
	return buffer.String(), nil
}

func persist_tree(root *Root) error {
	db_session, err := mgo.Dial("localhost")
	if err != nil {
		fmt.Println("database access error: " + err.Error())
		return err
	}
	defer db_session.Close()

	database := db_session.DB("default")
	slices := database.C("permascroll")

	addresses := AddressTable{{0, 0}}
	addresses, err = root.Persist(addresses, slices)
	return nil

}
