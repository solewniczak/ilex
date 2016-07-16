package main

type Node interface {
	AddRune(r rune, position int)
	SetParent(*Branch)
}

type Branch struct {
	Parent             *Branch
	LengthLeft, Length int
	Left, Right        Node
}

type PNode struct {
	Parent  *Branch
	Length  int
	Address int
}

type TNode struct {
	Parent *Branch
	Length int
	Text   []rune
}

func (t *TNode) AddRune(r rune, position int) {
	t.Text = append(t.Text, '界')
	copy(t.Text[position+1:], t.Text[position:])
	t.Text[position] = r
	t.Length++
}

func (b *Branch) AddRune(r rune, position int) {
	var child Node
	if b.LengthLeft > position {
		child = b.Left
		b.Length++
	} else {
		child = b.Right
		position = position - b.LengthLeft
	}
	b.Length++
	child.AddRune(r, position)
}

func (p *PNode) AddRune(r rune, position int) {
	up := &Branch{Parent: p.Parent, Length: p.Length + 1}
	if position > p.Length/2 {
		up.Left = &PNode{up, position, p.Address}
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
		if position > 0 {
			down := &Branch{Parent: up, Length: position + 1, LengthLeft: position}
			up.Left = down
			down.Right = &TNode{down, 1, []rune{r}}
			down.Left = &PNode{down, position, p.Address}
		} else {
			up.Right = &TNode{up, 1, []rune{r}}
		}
	}
	if p.Parent.Left == p {
		p.Parent.Left = up
	} else {
		p.Parent.Right = up
	}
}

func (b *Branch) SetParent(parent *Branch) {
	b.Parent = parent
}

func (p *PNode) SetParent(parent *Branch) {
	p.Parent = parent
}

func (t *TNode) SetParent(parent *Branch) {
	t.Parent = parent
}
